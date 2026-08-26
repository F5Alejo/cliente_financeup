    import { ComponentFixture, TestBed } from '@angular/core/testing';

    import { AdminMetasComponent } from './metas';

    describe('AdminMetasComponent', () => {
    let component: AdminMetasComponent;
    let fixture: ComponentFixture<AdminMetasComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
        imports: [AdminMetasComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminMetasComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    });